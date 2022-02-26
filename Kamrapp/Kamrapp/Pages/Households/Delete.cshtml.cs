#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Households
{
    public class DeleteModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DeleteModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        [BindProperty]
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

        public async Task<IActionResult> OnPostAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Household = await _context.Households.FindAsync(id);

            if (Household != null)
            {
                _context.Households.Remove(Household);
                await _context.SaveChangesAsync();
            }

            return RedirectToPage("./Index");
        }
    }
}
