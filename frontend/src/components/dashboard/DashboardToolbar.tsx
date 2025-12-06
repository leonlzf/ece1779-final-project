import React from "react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export type SearchMode = "name" | "tag";
export type SortMode =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "size_desc";

export function DashboardToolbar({
  query,
  setQuery,
  mode,
  setMode,
  sort,
  setSort,
  view,
  setView,
}: {
  query: string;
  setQuery: (v: string) => void;
  mode: SearchMode;
  setMode: (v: SearchMode) => void;
  sort: SortMode;
  setSort: (v: SortMode) => void;
  view: "list" | "grid";
  setView: (v: "list" | "grid") => void;
}) {
  return (
    <div className="dash-toolbar">
      <Input
        placeholder={mode === "name" ? "Search filenames…" : "Search tags…"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        containerClassName="dash-toolbar__search"
      />

      <Select
        value={mode}
        onChange={(e) => setMode(e.target.value as SearchMode)}
        containerClassName="dash-toolbar__select"
      >
        <option value="name">Filename</option>
        <option value="tag">Tag</option>
      </Select>

      <Select
        value={sort}
        onChange={(e) => setSort(e.target.value as SortMode)}
        containerClassName="dash-toolbar__select"
      >
        <option value="created_desc">Newest</option>
        <option value="created_asc">Oldest</option>
        <option value="name_asc">Name A→Z</option>
        <option value="name_desc">Name Z→A</option>
        <option value="size_desc">Largest</option>
      </Select>

      <div className="dash-toolbar__view">
        <Button
          variant={view === "list" ? "primary" : "outline"}
          size="sm"
          onClick={() => setView("list")}
        >
          List
        </Button>
        <Button
          variant={view === "grid" ? "primary" : "outline"}
          size="sm"
          onClick={() => setView("grid")}
        >
          Grid
        </Button>
      </div>

      {query && (
        <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
          Clear
        </Button>
      )}
    </div>
  );
}
