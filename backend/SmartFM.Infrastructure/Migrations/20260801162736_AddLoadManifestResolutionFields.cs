using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLoadManifestResolutionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DamagedOrMissingItems",
                table: "LoadManifests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDropoffResolved",
                table: "LoadManifests",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPickupResolved",
                table: "LoadManifests",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DamagedOrMissingItems",
                table: "DeliveryConfirmations",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DamagedOrMissingItems",
                table: "LoadManifests");

            migrationBuilder.DropColumn(
                name: "IsDropoffResolved",
                table: "LoadManifests");

            migrationBuilder.DropColumn(
                name: "IsPickupResolved",
                table: "LoadManifests");

            migrationBuilder.DropColumn(
                name: "DamagedOrMissingItems",
                table: "DeliveryConfirmations");
        }
    }
}
