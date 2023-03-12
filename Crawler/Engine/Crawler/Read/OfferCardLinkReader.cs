using MongoDB.Driver;

namespace Crawler.Read;

public class OfferCardLinkReader : IReader
{
    private IKeyRecordRepository<KeyRecord> OfferCardRepository { get; set; }
    private IKeyRecordRepository<KeyRecord> LinkRepository { get; set; }
    private IComboLogger Logger { get; set; }
    public IPage Page { get; set; }
    public ISelector Selector { get; set; }
    public OfferCardLinkReader(ISelector selector, IComboLogger logger)
    {
        Logger = logger;
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

    public async Task<(IEnumerable<string>, IEnumerable<string>, IEnumerable<string>, IEnumerable<string>)> GetCardsAndLinksAndDiscounts()
    {
        await Page.GotoAsync(Selector.OfferUrl);
        await Page.DeclineCookie(Selector.CookieSelector);

        return await GetOfferCardsAndLinksAndDiscounts();
    }

    private async Task<(IEnumerable<string>, IEnumerable<string>, IEnumerable<string>, IEnumerable<string>)> GetOfferCardsAndLinksAndDiscounts()
    {
        var offerCards = await CollectOfferCards();
        var filteredProductLinks_ALL = new List<string>();
        var filteredDiscounts_ALL = new List<string>();

        var (filteredOfferCards, discountCards) = FilterOfferCards(offerCards);

        if (!filteredOfferCards.Any() && !discountCards.Any())
            return (filteredOfferCards, filteredProductLinks_ALL, discountCards, filteredDiscounts_ALL);

        // DEBUG
        //var testCards = new List<string> { filteredOfferCards.First() };

        //foreach (var offerCard in testCards)
        foreach (var offerCard in filteredOfferCards)
        {
            Logger.Log(LoggerType.Console, LogType.Info, $"- Querying offer card: {offerCard}...");

            var productLinks = await CollectProductLinks(offerCard);
            var filteredProductLinks = FilterLinks(productLinks);
            foreach (var productLink in filteredProductLinks)
            {
                filteredProductLinks_ALL.AddIfNotContains(productLink);
            }
        }

        foreach (var discountCard in discountCards)
        {
            Logger.Log(LoggerType.Console, LogType.Info, $"- Querying discount card: {discountCard}...");

            var discounts = await CollectDiscounts(discountCard);
            foreach (var discount in discounts)
            {
                filteredDiscounts_ALL.AddIfNotContains(discount);
            }
        }

        return (filteredOfferCards, filteredProductLinks_ALL, discountCards, filteredDiscounts_ALL);
    }

    private async Task<IEnumerable<string>> CollectOfferCards()
    {
        Logger.Log(LoggerType.Console, LogType.Info, $"- Collecting offer cards...");

        var cards = await Page.QuerySelectorAllAsync(Selector.OfferCardSelector);

        var offerCards = new List<string>();
        foreach (var card in cards)
        {
            var link = await LinkHelper.GetElementLink(card);

            offerCards.AddIfNotContains(link);
        }

        Logger.Log(LoggerType.Console, LogType.Info, $" collected {offerCards.Count}");
        return offerCards;
    }

    private async Task<IEnumerable<string>> BasicDiscountCollector()
    {
        var discountElements = new List<string>();

        var discountElementCandidates = await Page.QuerySelectorAllAsync(Selector.DiscountSelector);
        foreach (var candidate in discountElementCandidates)
        {
            var discountElement = await ReadDiscount(candidate);
            if (!string.IsNullOrEmpty(discountElement))
                discountElements.AddIfNotContains(discountElement);
        }

        return discountElements;
    }

    private async Task<IEnumerable<string>> AldiDiscountCollector()
    {
        var discountElements = new List<string>();

        var mainHtml = await Page.QuerySelectorAsync(Selector.DiscountSelector);

        if (mainHtml == null)
            return discountElements;

        var mainText = await mainHtml.InnerHTMLAsync();

        var document = new HtmlDocument();
        document.LoadHtml(mainText);

        var divNodes = document.DocumentNode.SelectNodes("div");
        if (!divNodes.Any())
            return discountElements;

        // check in pairs
        for (int i = 0; i < divNodes.Count - 1; i++)
        {
            var divHeaderNode = divNodes[i];
            if (!divHeaderNode.HasClass(Selector.DiscountHeaderFilter))
                continue;

            var divGroupNode = divNodes[i + 1];
            if (!divGroupNode.HasClass(Selector.DiscountGroupFilter))
                continue;

            var headerNode = divHeaderNode.SelectSingleNode(Selector.DiscountHeaderSelector);
            if (headerNode == null)
                continue;

            var headerText = divHeaderNode.InnerText.Trim();
            var headerTextWrapped = $"<validityHeader>{headerText}</validityHeader>";

            var groupElements = divGroupNode.SelectNodes(Selector.DiscountElementSelector);
            foreach (var groupElement in groupElements)
            {
                var elementHtml = headerTextWrapped + groupElement.InnerHtml;
                discountElements.AddIfNotContains(elementHtml);
            }
        }

        return discountElements;
    }

    private async Task<IEnumerable<string>> CollectDiscounts(string offerCard)
    {
        await Page.GotoAsync(Selector.BuildUrl(offerCard));
        await Page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        var discountElements = new List<string>();

        // huehue
        switch (Selector.DiscountCollectorType)
        {
            case DiscountCollectorType.Basic: discountElements = (List<string>)await BasicDiscountCollector(); break;
            case DiscountCollectorType.Aldi: discountElements = (List<string>)await AldiDiscountCollector(); break;
        }

        Logger.Log(LoggerType.Console, LogType.Info, $" collected {discountElements.Count}");
        return discountElements;
    }

    private async Task<IEnumerable<string>> CollectProductLinks(string offerCard)
    {
        await Page.GotoAsync(Selector.BuildUrl(offerCard));
        await Page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        var productReferences = new List<string>();

        var productLinkCandidates = await Page.QuerySelectorAllAsync(Selector.LinkSelector);
        foreach (var candidate in productLinkCandidates)
        {
            var productReference = await ReadProductReference(candidate);
            if (!string.IsNullOrEmpty(productReference))
                productReferences.AddIfNotContains(productReference);
        }

        Logger.Log(LoggerType.Console, LogType.Info, $" collected {productReferences.Count}");
        return productReferences;
    }

    private (IEnumerable<string>, IEnumerable<string>) FilterOfferCards(IEnumerable<string> offerCards)
    {
        Logger.Log(LoggerType.Console, LogType.Info, $"- Filtering  offer cards...");

        var discountCards = new List<string>();
        var realOfferCards = new List<string>();
        foreach (var offerCard in offerCards)
        {
            if (Selector.IsOfferCardDiscountCollection(offerCard))
            {
                discountCards.AddIfNotContains(offerCard);
            }
            else
            {
                realOfferCards.AddIfNotContains(offerCard);
            }
        }

        var filteredOfferCards = FilterItems(OfferCardRepository, realOfferCards);

        Logger.Log(LoggerType.File, LogType.Info, $" filtered  {filteredOfferCards.Count()} offerCard(s) and {discountCards.Count} discountCard(s).");
        return (filteredOfferCards, discountCards);
    }

    private IEnumerable<string> FilterLinks(IEnumerable<string> links)
    {
        var filteredLinks = FilterItems(LinkRepository, links);

        Logger.Log(LoggerType.File, LogType.Info, $" filtered  {filteredLinks.Count()}.");
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

    protected static async Task<string> ReadDiscount(IElementHandle productData)
    {
        try
        {
            var discount = await productData.InnerHTMLAsync();

            //if (!Selector.DiscountMatcher(discount))
            //    return null;

            return discount;
        }
        catch
        {
            return null;
        }
    }
}
