using Microsoft.EntityFrameworkCore;

namespace Crawler.Data.Models
{
    public partial class LidlContext : DbContext
    {
        public LidlContext()
        {
        }

        public LidlContext(DbContextOptions<LidlContext> options)
            : base(options)
        {
        }

        public virtual DbSet<LidlProduct> Catalog { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=Microsoft.eShopOnWeb.CatalogDb;Trusted_Connection=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "2.2.2-servicing-10034");

            modelBuilder.Entity<LidlProduct>(entity =>
            {
                //entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.Id).UseHiLo("catalog_hilo").IsRequired();

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            });

            modelBuilder.HasSequence("catalog_hilo").IncrementsBy(10);
        }
    }
}
