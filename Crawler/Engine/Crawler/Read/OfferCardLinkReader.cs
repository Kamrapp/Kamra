using MongoDB.Driver;

namespace Crawler.Read;

public class OfferCardLinkReader : IReader
{
    private IKeyRecordRepository<KeyRecord> OfferCardRepository { get; set; }
    private IKeyRecordRepository<KeyRecord> LinkRepository { get; set; }
    public IPage Page { get; set; }
    public ISelector Selector { get; set; }
    public OfferCardLinkReader(ISelector selector)
    {
        Selector = selector;
    }

    public OfferCardLinkReader WithRepositories(IKeyRecordRepository<KeyRecord> offerCardRepository, IKeyRecordRepository<KeyRecord> linkRepository)
    {
        OfferCardRepository = offerCardRepository;
        LinkRepository = linkRepository;
        return this;
    }

    public void SetConnection(IMongoDatabase database)
    {
        OfferCardRepository.SetConnection(database);
        LinkRepository.SetConnection(database);
    }

    public void SetPage(IPage page)
    {
        Page = page;
    }

    public async Task<(IEnumerable<string>, IEnumerable<string>)> GetCardsAndLinks()
    {
        await Page.GotoAsync(Selector.OfferUrl);
        await Page.DeclineCookie(Selector.CookieSelector);

        return await GetOfferCardsAndLinks();
    }

    private async Task<(IEnumerable<string>, IEnumerable<string>)> GetOfferCardsAndLinks()
    {
        var offerCards = await CollectOfferCards();
        var filteredProductLinks_ALL = new List<string>();

        var filteredOfferCards = FilterOfferCards(offerCards);

        if (!filteredOfferCards.Any())
            return (filteredOfferCards, filteredProductLinks_ALL);

        // DEBUG
        //var testCards = new List<string> { filteredOfferCards.First() };

        //foreach (var offerCard in testCards)
        foreach (var offerCard in filteredOfferCards)
        {
            Console.WriteLine($"- Querying {offerCard}...");

            var productLinks = await CollectProductLinks(offerCard);

            var filteredProductLinks = FilterLinks(productLinks);

            foreach (var productLink in filteredProductLinks)
            {
                filteredProductLinks_ALL.AddIfNotContains(productLink);
            }
        }

        return (filteredOfferCards, filteredProductLinks_ALL);
    }

    private async Task<IEnumerable<string>> CollectOfferCards()
    {
        Console.Write($"- Collecting offer cards...");

        var cards = await Page.QuerySelectorAllAsync(Selector.OfferCardSelector);

        var offerCards = new List<string>();
        foreach (var card in cards)
        {
            var link = await LinkHelper.GetElementLink(card);

            offerCards.AddIfNotContains(link);
        }

        Console.WriteLine($" collected {offerCards.Count}");
        return offerCards;
    }

    private async Task<IEnumerable<string>> CollectProductLinks(string offerCard)
    {
        await Page.GotoAsync(Selector.BuildUrl(offerCard));
        await Page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        var productReferences = new List<string>();

        await Page.ScreenshotAsync(new()
        {
            Path = "C:\\code\\master\\Kamra\\Crawler\\AldiCrawler\\bin\\screenshot.png",
            FullPage = true,
        });

        var candidates = await Page.QuerySelectorAllAsync(Selector.LinkSelector);
        foreach (var candidate in candidates)
        {
            if (!await MatchProductData(candidate))
                continue;

            var productReference = await ReadProductReference(candidate);
            if (string.IsNullOrEmpty(productReference))
                continue;

            productReferences.AddIfNotContains(productReference);
        }

        Console.Write($" collected {productReferences.Count}");
        return productReferences;
    }

    private IEnumerable<string> FilterOfferCards(IEnumerable<string> offercards)
    {
        Console.Write($"- Filtering  offer cards...");

        var filteredCards = FilterItems(OfferCardRepository, offercards);

        Console.WriteLine($" filtered  {filteredCards.Count()}.");
        return filteredCards;
    }

    private IEnumerable<string> FilterLinks(IEnumerable<string> links)
    {
        var filteredLinks = FilterItems(LinkRepository, links);

        Console.WriteLine($" | filtered  {filteredLinks.Count()}.");
        return filteredLinks;
    }

    private static IEnumerable<string> FilterItems(IKeyRecordRepository<KeyRecord> repository, IEnumerable<string> items)
    {
        var filteredItems = new List<string>();

        foreach (var item in items)
        {
            if (item == null)
                continue;

            if (repository.Get(item) != null)
                continue;

            filteredItems.Add(item);
        }

        return filteredItems;
    }

    protected async Task<bool> MatchProductData(IElementHandle candidate)
    {
        if (Selector.ProductAttribute == null)
            return true;

        try
        {
            var dataSelector = await candidate.GetAttributeAsync(Selector.ProductAttribute);
            return Selector.ProductDataMatcher(dataSelector);
        }
        catch
        {
            return false;
        }
    }

    protected async Task<string> ReadProductReference(IElementHandle productData)
    {
        try
        {
            var productReference = await productData.GetAttributeAsync(Selector.ReferenceAttribute);

            if (!Selector.ProductReferenceMatcher(productReference))
                return null;

            return productReference;
        }
        catch
        {
            return null;
        }
    }
}
