using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReportKpiFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActiveVehicles",
                table: "Reports",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AssignmentsByBranchJson",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AssignmentsByDayJson",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AssignmentsByDriverJson",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "BranchId",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IncidentCount",
                table: "Reports",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Revenue",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TotalAssignments",
                table: "Reports",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalCargoWeightKg",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActiveVehicles",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AssignmentsByBranchJson",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AssignmentsByDayJson",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AssignmentsByDriverJson",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "IncidentCount",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Revenue",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TotalAssignments",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TotalCargoWeightKg",
                table: "Reports");
        }
    }
}
