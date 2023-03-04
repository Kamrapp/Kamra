using Microsoft.Playwright;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Reader
{
    public interface IReader
    {
        public IPage Page { get; set; }
        public Task<IEnumerable<string>> GetLinks();
    }
}
