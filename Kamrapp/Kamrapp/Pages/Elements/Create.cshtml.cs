#nullable disable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Kamrapp.Data;
using Kamrapp.Model;

namespace Kamrapp.Pages.Elements
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
        public Element Element { get; set; }

        // To protect from overposting attacks, see https://aka.ms/RazorPagesCRUD
        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Elements.Add(Element);
            await _context.SaveChangesAsync();
            TempData["success"] = "Element created successfully";
            return RedirectToPage("./Index");
        }
    }
}
