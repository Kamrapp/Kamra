#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Households
{
    public class IndexModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public IndexModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public IList<Household> Household { get; set; }

        public async Task OnGetAsync()
        {
            Household = await _context.Households.ToListAsync();
        }
    }
}
