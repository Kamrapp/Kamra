#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Kamrapp.Pages.Stocks
{
    public class CreateModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public CreateModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult OnGet()
        {
            ViewData["ElementId"] = new SelectList(_context.Elements, "Id", "GlobalName");
            ViewData["HouseholdId"] = new SelectList(_context.Households, "Id", "Name");
            return Page();
        }

        [BindProperty]
        public Stock Stock { get; set; }

        // To protect from overposting attacks, see https://aka.ms/RazorPagesCRUD
        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Stocks.Add(Stock);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
