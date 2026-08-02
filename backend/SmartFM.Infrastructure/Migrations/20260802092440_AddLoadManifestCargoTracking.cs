using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLoadManifestCargoTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CargoIds",
                table: "LoadManifests",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "LoadedCargoIds",
                table: "LoadManifests",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CargoIds",
                table: "LoadManifests");

            migrationBuilder.DropColumn(
                name: "LoadedCargoIds",
                table: "LoadManifests");
        }
    }
}
