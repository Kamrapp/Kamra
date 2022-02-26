#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Elements
{
    public class DeleteModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DeleteModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        [BindProperty]
        public Element Element { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Element = await _context.Elements.FirstOrDefaultAsync(m => m.Id == id);

            if (Element == null)
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

            Element = await _context.Elements.FindAsync(id);

            if (Element != null)
            {
                _context.Elements.Remove(Element);
                await _context.SaveChangesAsync();
                TempData["success"] = "Element deleted successfully";
            }

            return RedirectToPage("./Index");
        }
    }
}
