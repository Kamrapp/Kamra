#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Elements
{
    public class EditModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public EditModel(Kamrapp.Data.ApplicationDbContext context)
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

        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see https://aka.ms/RazorPagesCRUD.
        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Attach(Element).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ElementExists(Element.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            TempData["success"] = "Element edited successfully";
            return RedirectToPage("./Index");
        }

        private bool ElementExists(int id)
        {
            return _context.Elements.Any(e => e.Id == id);
        }
    }
}
