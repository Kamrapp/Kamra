#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Elements
{
    public class DetailsModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DetailsModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

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
    }
}
