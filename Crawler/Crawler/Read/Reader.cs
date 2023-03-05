namespace Crawler.Read;

public class Reader : IReader
{
    public IPage Page { get; set; }

    public const int MaxItems = -1;
    public ISelector Selector { get; set; }
    public Reader(IPage page, ISelector selector)
    {
        Page = page;
        Selector = selector;
    }

    public async Task<IEnumerable<string>> GetLinks()
    {
        await Page.GotoAsync(Selector.UrlBase);
        await Page.DeclineCookie(Selector.CookieSelector);

        return await GetProductLinks();
    }

    private async Task<IEnumerable<string>> GetProductLinks()
    {
        var productLinks = new List<string>();

        var offerCards = await CollectOfferCards();
        int maxWidth = offerCards.Max(offer => offer.Length) + 4;

        //int whichOne = 0;
        foreach (var offerCard in offerCards)
        {
            // DEBUG
            //if (++whichOne != 4)
            //    continue;

            if (offerCard == null)
                continue;

            var previousCount = productLinks.Count;

            Console.Write($"- {(offerCard+ "...").PadRight(maxWidth)}");
            {
                var offers = await CollectOffers(offerCard);
                foreach (var offer in offers)
                {
                    if (offer == null)
                        continue;

                    productLinks.AddIfNotContains(offer);

                    // Limit collection for debug purposes
                    if(0 <= MaxItems && MaxItems <= productLinks.Count)
                    {
                        return productLinks;
                    }
                }
            }
            Console.WriteLine($" Collected {productLinks.Count - previousCount,8}.");
        }

        return productLinks;
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

    private async Task<IEnumerable<string>> CollectOffers(string offerCard)
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
