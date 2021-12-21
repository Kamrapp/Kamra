#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Kamrapp.Pages.Households
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
            return Page();
        }

        [BindProperty]
        public Household Household { get; set; }

        // To protect from overposting attacks, see https://aka.ms/RazorPagesCRUD
        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Households.Add(Household);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
