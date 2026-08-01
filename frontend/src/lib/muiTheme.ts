import { createTheme } from "@mui/material/styles";

const muiTheme = createTheme({
  palette: {
    primary: { main: "#49c9c1", dark: "#41b3b0" },
    secondary: { main: "#0c8783" },
    error: { main: "#ef504e", light: "#f68f81" },
    background: { default: "#e6e4e3", paper: "#ffffff" },
    text: { primary: "#0f3330" },
  },
  shape: {
    borderRadius: 0,
  },
  typography: {
    fontFamily: "inherit",
    h1: { fontFamily: "var(--font-heading), sans-serif" },
    h2: { fontFamily: "var(--font-heading), sans-serif" },
    h3: { fontFamily: "var(--font-heading), sans-serif" },
    h4: { fontFamily: "var(--font-heading), sans-serif" },
    h5: { fontFamily: "var(--font-heading), sans-serif" },
    h6: { fontFamily: "var(--font-heading), sans-serif" },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: "var(--font-heading), sans-serif",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: "1px solid #d1d5db",
          backgroundImage: "none",
        },
      },
    },
  },
});

export default muiTheme;
