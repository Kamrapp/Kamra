using Crawler.Helpers;

using Microsoft.Playwright;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Reader
{
    public class Reader : IReader
    {
        public IPage Page { get; set; }
        public ISelector Selector { get; set; }
        public Reader(ISelector selector)
        {
            Selector = selector;
        }

        public async Task<IEnumerable<string>> GetLinks()
        {
            await Page.GotoAsync(Selector.UrlBase);
            await DeclineCookie();

            return await GetProductLinks();
        }

        private async Task DeclineCookie()
        {
            var cookieDeclineButton = await Page.QuerySelectorAsync(Selector.CookieSelector);
            if (cookieDeclineButton != null)
            {
                await cookieDeclineButton.ClickAsync();
            }
        }

        private async Task<IEnumerable<string>> GetProductLinks()
        {
            var items = new List<string>();

            await foreach (var offerCard in CollectOfferCards())
            {
                await foreach (var offer in CollectOffers(offerCard))
                {
                    if (!items.Contains(offer))
                        items.Add(offer.ToString());
                }
            }

            return items;
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
                if (await FilterProductData(candidate))
                    continue;

                yield return await ReadProductReference(candidate);
            }
        }

        protected async Task<bool> FilterProductData(IElementHandle candidate)
        {
            try
            {
                var dataSelector = await candidate.GetAttributeAsync(Selector.DataAttribute);
                return Selector.ProductDataFilter(dataSelector);
            }
            catch (Exception)
            {
                return true;
            }
        }

        protected async Task<string> ReadProductReference(IElementHandle productData)
        {
            try
            {
                var productReference = await productData.GetAttributeAsync(Selector.ReferenceAttribute);

                if (Selector.ProductReferenceFilter(productReference))
                    return "";

                Console.WriteLine($"Adding {productReference} to the item list");
                return productReference;
            }
            catch (Exception)
            {
                //href not there, most probably wrong child
                return "";
            }
        }
    }
}
