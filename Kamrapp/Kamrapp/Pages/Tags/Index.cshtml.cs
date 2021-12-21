#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Tags
{
    public class IndexModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public IndexModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public IList<Tag> Tag { get; set; }

        public async Task OnGetAsync()
        {
            Tag = await _context.Tags.ToListAsync();
        }
    }
}
