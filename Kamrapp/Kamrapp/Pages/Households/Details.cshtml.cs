#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Households
{
    public class DetailsModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DetailsModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public Household Household { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Household = await _context.Households.FirstOrDefaultAsync(m => m.Id == id);

            if (Household == null)
            {
                return NotFound();
            }
            return Page();
        }
    }
}
