using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeDeliveryConfirmationGpsOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<double>(
                name: "GpsLongitude",
                table: "DeliveryConfirmations",
                type: "REAL",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "REAL");

            migrationBuilder.AlterColumn<double>(
                name: "GpsLatitude",
                table: "DeliveryConfirmations",
                type: "REAL",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "REAL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<double>(
                name: "GpsLongitude",
                table: "DeliveryConfirmations",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "REAL",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "GpsLatitude",
                table: "DeliveryConfirmations",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "REAL",
                oldNullable: true);
        }
    }
}
