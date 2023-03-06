using MongoDB.Driver;

namespace Crawler.Read;

public class OfferCardLinkReader : IReader
{
    private IKeyRecordService<KeyRecord> OfferCardService { get; set; }
    private IKeyRecordService<KeyRecord> LinkService { get; set; }
    public IPage Page { get; set; }
    public ISelector Selector { get; set; }
    public OfferCardLinkReader(IPage page, ISelector selector)
    {
        Page = page;
        Selector = selector;
    }

    public OfferCardLinkReader WithServices(IKeyRecordService<KeyRecord> offerCardService, IKeyRecordService<KeyRecord> linkService)
    {
        OfferCardService = offerCardService;
        LinkService = linkService;
        return this;
    }

    public void SetConnection(IMongoDatabase database)
    {
        OfferCardService.SetConnection(database);
        LinkService.SetConnection(database);
    }

    public async Task<(IEnumerable<string>, IEnumerable<string>)> GetCardsAndLinks()
    {
        await Page.GotoAsync(Selector.UrlBase);
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

        int maxWidth = filteredOfferCards.Max(offer => offer.Length) + 4;

        foreach (var offerCard in filteredOfferCards)
        {
            var previousCount = filteredProductLinks_ALL.Count;

            Console.Write($"- {(offerCard + "...").PadRight(maxWidth)}");
            {
                var productLinks = await CollectProductLinks(offerCard);

                var filteredProductLinks = FilterLinks(productLinks);

                foreach (var productLink in filteredProductLinks)
                {
                    filteredProductLinks_ALL.AddIfNotContains(productLink);
                }
            }
            Console.WriteLine($" Collected {filteredProductLinks_ALL.Count - previousCount,8}.");
        }

        return (filteredOfferCards, filteredProductLinks_ALL);
    }

    private async Task<IEnumerable<string>> CollectOfferCards()
    {
        var cards = await Page.QuerySelectorAllAsync(Selector.CardSelector);

        var offerCards = new List<string>();
        foreach (var card in cards)
        {
            var link = await LinkHelper.GetElementLink(card);

            offerCards.AddIfNotContains(link);
        }

        return offerCards;
    }

    private async Task<IEnumerable<string>> CollectProductLinks(string offerCard)
    {
        await Page.GotoAsync($"{Selector.UrlBase}{offerCard}");
        await Page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        var productReferences = new List<string>();

        var candidates = await Page.QuerySelectorAllAsync(Selector.CandidateSelector);
        foreach (var candidate in candidates)
        {
            if (!await MatchProductData(candidate))
                continue;

            var productReference = await ReadProductReference(candidate);
            if (string.IsNullOrEmpty(productReference))
                continue;

            productReferences.AddIfNotContains(productReference);
        }

        return productReferences;
    }

    private IEnumerable<string> FilterOfferCards(IEnumerable<string> offercards)
    {
        Console.WriteLine($"- Filtering offer cards...");

        var filteredCards = FilterItems(OfferCardService, offercards);

        Console.Write($" Remains {filteredCards.Count()}.");
        return filteredCards;
    }

    private IEnumerable<string> FilterLinks(IEnumerable<string> links)
    {
        Console.WriteLine($"- - Filtering product links...");

        var filteredLinks = FilterItems(LinkService, links);

        Console.Write($" Remains {filteredLinks.Count()}.");
        return filteredLinks;
    }

    private IEnumerable<string> FilterItems(IKeyRecordService<KeyRecord> service, IEnumerable<string> items)
    {
        var filteredItems = new List<string>();

        foreach (var item in items)
        {
            if (item == null)
                continue;

            if (service.Get(item) != null)
                continue;

            filteredItems.Add(item);
        }

        return filteredItems;
    }

    protected async Task<bool> MatchProductData(IElementHandle candidate)
    {
        try
        {
            var dataSelector = await candidate.GetAttributeAsync(Selector.DataAttribute);
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
