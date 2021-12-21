#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Stocks
{
    public class DetailsModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DetailsModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public Stock Stock { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Stock = await _context.Stocks
                .Include(s => s.Element)
                .Include(s => s.Household).FirstOrDefaultAsync(m => m.Id == id);

            if (Stock == null)
            {
                return NotFound();
            }
            return Page();
        }
    }
}
