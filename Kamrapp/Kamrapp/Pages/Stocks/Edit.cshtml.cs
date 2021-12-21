#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Stocks
{
    public class EditModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public EditModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        [BindProperty]
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
            ViewData["ElementId"] = new SelectList(_context.Elements, "Id", "GlobalName");
            ViewData["HouseholdId"] = new SelectList(_context.Households, "Id", "Name");
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

            _context.Attach(Stock).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StockExists(Stock.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return RedirectToPage("./Index");
        }

        private bool StockExists(int id)
        {
            return _context.Stocks.Any(e => e.Id == id);
        }
    }
}
