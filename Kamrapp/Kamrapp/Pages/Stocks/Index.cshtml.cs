#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Stocks
{
    public class IndexModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public IndexModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public IList<Stock> Stock { get; set; }

        public async Task OnGetAsync()
        {
            Stock = await _context.Stocks
                .Include(s => s.Element)
                .Include(s => s.Household).ToListAsync();
        }
    }
}
