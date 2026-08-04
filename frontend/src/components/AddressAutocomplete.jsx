"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { searchAddressSuggestions } from "@/lib/geo";

const DEBOUNCE_MS = 400;

export default function AddressAutocomplete({
  label,
  value,
  onInputChange,
  onSelect,
  buildQuery,
  minChars = 3,
  placeholder,
}) {
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const handleInputChange = (event, newValue, reason) => {
    if (reason === "input" || reason === "clear") {
      onInputChange(newValue);
    }
    if (reason !== "input") return;

    const nextQuery = buildQuery ? buildQuery(newValue) : newValue;
    setQuery(nextQuery.trim().length >= minChars ? nextQuery : "");
  };

  React.useEffect(() => {
    if (!query) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setLoading(true);
      searchAddressSuggestions(query).then((results) => {
        if (cancelled) return;
        setOptions(results);
        setLoading(false);
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  const visibleOptions = query ? options : [];
  const showLoading = loading && Boolean(query);

  return (
    <Autocomplete
      freeSolo
      filterOptions={(x) => x}
      options={visibleOptions}
      loading={showLoading}
      inputValue={value}
      onInputChange={handleInputChange}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.displayName
      }
      isOptionEqualToValue={(option, val) =>
        option.displayName === (typeof val === "string" ? val : val?.displayName)
      }
      onChange={(event, newValue) => {
        if (newValue && typeof newValue !== "string") {
          onSelect(newValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {showLoading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
