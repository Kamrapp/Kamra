using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    public partial class DistributorKeytoElement : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MongoProductId",
                table: "Stocks");

            migrationBuilder.AddColumn<string>(
                name: "DistributorKey",
                table: "Elements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Shops",
                columns: new[] { "Id", "Name" },
                values: new object[] { 1, "Lidl" });

            migrationBuilder.InsertData(
                table: "Shops",
                columns: new[] { "Id", "Name" },
                values: new object[] { 2, "Aldi" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Shops",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Shops",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DropColumn(
                name: "DistributorKey",
                table: "Elements");

            migrationBuilder.AddColumn<string>(
                name: "MongoProductId",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
