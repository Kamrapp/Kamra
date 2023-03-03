using Crawler.Request;
using Microsoft.Playwright;
using HtmlAgilityPack;

using Microsoft.Playwright;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using IRequest = Crawler.Request.IRequest;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using Crawler.Helpers;
using static System.Net.Mime.MediaTypeNames;

namespace Crawler.Downloader
{
    /// <summary>
    /// Get Urls
    // https://codereview.stackexchange.com/questions/139783/web-crawler-that-uses-task-parallel-library 
    /// </summary>
    public static class LinkReader
    {
        public static async Task<IEnumerable<string>> GetLinks(string url)
        {
            using var pw = await Playwright.CreateAsync();
            await using var browser = await pw.Chromium.LaunchAsync();

            var page = await browser.NewPageAsync();

            var items = new List<string>();

            var cardSelector = "a.AHeroStageItems__Item--Wrapper";

            await page.GotoAsync(url);

            var cookieDeclineButton = await page.QuerySelectorAsync("button.cookie-alert-decline-button");
            if (cookieDeclineButton != null)
            {
                await cookieDeclineButton.ClickAsync();
            }

            var offerCardElements = await page.QuerySelectorAllAsync(cardSelector);

            var offerCards = new List<string>();
            foreach (var offerCardElement in offerCardElements)
            {
                string href = "";
                try
                {
                    href = await offerCardElement.GetAttributeAsync("href");
                }
                catch (Exception)
                {
                    //should handle
                }

                if (!href.Any())
                    continue;

                var cleanHref = href[..href.IndexOf("?")];
                offerCards.Add(cleanHref);
            }

            foreach (var offerCard in offerCards)
            {
                await page.GotoAsync($"https://www.lidl.hu{offerCard}");

                //await page.Keyboard.DownAsync("End");

                //await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

                //for(int i = 0; i< 10; i++)
                //{
                //    await page.Mouse.WheelAsync(0, 10000);
                //    System.Threading.Thread.Sleep(500);
                //}

                await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

                //await page.ScreenshotAsync(new()
                //{
                //    Path = "screenshot.png",
                //    FullPage = true
                //});

                //var innerHtml = await page.InnerHTMLAsync("div.ATheCampaign__Page");

                //var offerSelector = "div.AProductGridBox";
                    //"a.grid-box__pdp-link";
                    //"div.AProductGridBox";
                var divs = await page.QuerySelectorAllAsync("div");
                foreach (var div in divs)
                {
                    string offerRef = "";
                    try
                    {
                        var dataSelector = await div.GetAttributeAsync("data-selector");
                        if (dataSelector != "PRODUCT")
                            continue;

                        offerRef = await div.GetAttributeAsync("canonicalUrl");

                        //("canonicalUrl");
                    }
                    catch (Exception)
                    {
                        //href not there, most probably wrong child
                        continue;
                    }


                    if (!offerRef.StartsWith("/p/"))
                        continue;

                    if (items.Contains(offerRef))
                        continue;

                    Console.WriteLine($"Adding {offerRef} to the item list");
                    items.Add(offerRef);
                }
            }

            return items;
        }

        private static async IAsyncEnumerable<string> CollectChildLinks(IPage page, string url, string selector, Func<string, string> hRefCleaner = null)
        {
            //Console.WriteLine($"{prefix}Crawling {url} ...");
            await page.GotoAsync(url);

            //Console.WriteLine($"{prefix}Collecting children with selector: {selector} ...");
            var childrenHandles = await page.QuerySelectorAllAsync(selector);
            foreach (var childrenHandle in childrenHandles)
            {
                string href = "";
                try
                {
                    href = await childrenHandle.GetAttributeAsync("href");
                }
                catch(Exception)
                {
                    //href not there, most probably wrong child
                }

                if (!href.Any())
                    continue;

                if(hRefCleaner != null )
                    href = hRefCleaner(href);

                //Console.WriteLine($"{prefix}Found following child: {href}");

                yield return href;
            }
        }
    }
}
