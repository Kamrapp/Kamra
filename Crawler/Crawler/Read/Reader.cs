using Crawler.Helpers;
using Crawler.Select;
using Shared.Extensions;

using Microsoft.Playwright;

using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Read
{
    public class Reader : IReader
    {
        public IPage Page { get; set; }
        public int MaxItems { get; set; }
        public ISelector Selector { get; set; }
        public Reader(IPage page, ISelector selector, int maxItems = -1)
        {
            Page = page;
            Selector = selector;
            MaxItems = maxItems;
        }

        public async Task<IEnumerable<string>> GetLinks()
        {
            await Page.GotoAsync(Selector.UrlBase);

            return await GetProductLinks();
        }

        private async Task<IEnumerable<string>> GetProductLinks()
        {
            var productLinks = new List<string>();

            await foreach (var offerCard in CollectOfferCards())
            {
                await foreach (var offer in CollectOffers(offerCard))
                {
                    productLinks.AddIfNotExists(offer);

                    // Limit collection for debug purposes
                    if(0 <= MaxItems && MaxItems <= productLinks.Count)
                    {
                        return productLinks;
                    }
                }
            }

            return productLinks;
        }

        private async IAsyncEnumerable<string> CollectOfferCards()
        {
            var cards = await Page.QuerySelectorAllAsync(Selector.CardSelector);
            foreach (var card in cards)
            {
                yield return await LinkHelper.GetElementLink(card);
            }
        }

        private async IAsyncEnumerable<string> CollectOffers(string offerCard)
        {
            await Page.GotoAsync($"{Selector.UrlBase}{offerCard}");
            await Page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

            var candidates = await Page.QuerySelectorAllAsync(Selector.CandidateSelector);
            foreach (var candidate in candidates)
            {
                if (!await MatchProductData(candidate))
                    continue;

                var productReference = await ReadProductReference(candidate);
                if (string.IsNullOrEmpty(productReference))
                    continue;

                yield return productReference;
            }
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
}
