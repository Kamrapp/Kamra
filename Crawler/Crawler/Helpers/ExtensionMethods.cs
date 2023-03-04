using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Helpers
{
    public static class ExtensionMethods
    {
        public static async Task<IEnumerable<string>> ToEnumerable(this IAsyncEnumerable<string> asyncEnumerable)
        {
            var results = new List<string>();
            await foreach (var result in asyncEnumerable)
            {
                results.Add(result);
            }
            return results;
        }
    }
}
