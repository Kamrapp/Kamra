#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Tags
{
    public class DeleteModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DeleteModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        [BindProperty]
        public Tag Tag { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Tag = await _context.Tags.FirstOrDefaultAsync(m => m.Id == id);

            if (Tag == null)
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

            Tag = await _context.Tags.FindAsync(id);

            if (Tag != null)
            {
                _context.Tags.Remove(Tag);
                await _context.SaveChangesAsync();
                TempData["success"] = "Tag deleted successfully";
            }

            return RedirectToPage("./Index");
        }
    }
}
