using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    public partial class stockforshop : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_Households_HouseholdId",
                table: "Stocks");

            migrationBuilder.AlterColumn<int>(
                name: "HouseholdId",
                table: "Stocks",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MongoId",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MongoPrice",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MongoProductId",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MongoShop",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalPrice",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_Households_HouseholdId",
                table: "Stocks",
                column: "HouseholdId",
                principalTable: "Households",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_Households_HouseholdId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "MongoId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "MongoPrice",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "MongoProductId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "MongoShop",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "OriginalPrice",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "Stocks");

            migrationBuilder.AlterColumn<int>(
                name: "HouseholdId",
                table: "Stocks",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_Households_HouseholdId",
                table: "Stocks",
                column: "HouseholdId",
                principalTable: "Households",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
