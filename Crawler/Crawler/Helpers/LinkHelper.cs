using Microsoft.Playwright;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace Crawler.Helpers
{
    public static class LinkHelper
    {
        public static async Task<string> GetElementLink(IElementHandle elementHandle)
        {
            string href = "";
            try
            {
                href = await elementHandle.GetAttributeAsync("href");
            }
            catch (Exception)
            {
                //should handle
            }

            if (!href.Any())
                return null;

            var cleanHref = href[..href.IndexOf("?")];
            return cleanHref;
        }
    }
}
