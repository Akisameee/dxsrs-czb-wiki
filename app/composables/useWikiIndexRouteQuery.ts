import type { Ref } from "vue";
import type { LocationQuery, LocationQueryRaw } from "vue-router";
import { nextTick, watch } from "vue";

type WikiIndexQueryField = {
  key: string;
  value: Ref<string>;
  defaultValue?: string;
};

export type UseWikiIndexRouteQueryOptions = {
  search: Ref<string>;
  page: Ref<number>;
  filters: WikiIndexQueryField[];
  searchKey?: string;
  pageKey?: string;
};

function firstQueryValue(value: LocationQuery[string] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function queryString(query: LocationQuery, key: string, fallback = "") {
  return firstQueryValue(query[key]) || fallback;
}

function queryPage(query: LocationQuery, key: string) {
  const value = Number(firstQueryValue(query[key]));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function queryValue(value: unknown) {
  if (Array.isArray(value)) return value.join(",");
  return value == null ? "" : String(value);
}

function sameQuery(current: LocationQuery, next: LocationQueryRaw) {
  const keys = new Set([...Object.keys(current), ...Object.keys(next)]);
  for (const key of keys) {
    if (queryValue(current[key]) !== queryValue(next[key])) return false;
  }
  return true;
}

export function useWikiIndexRouteQuery(options: UseWikiIndexRouteQueryOptions) {
  const route = useRoute();
  const router = useRouter();
  const searchKey = options.searchKey || "q";
  const pageKey = options.pageKey || "page";
  let syncingFromRoute = false;

  function applyRouteQuery(query = route.query) {
    syncingFromRoute = true;
    options.search.value = queryString(query, searchKey);
    for (const filter of options.filters) {
      filter.value.value = queryString(query, filter.key, filter.defaultValue || "all");
    }
    options.page.value = queryPage(query, pageKey);
    void nextTick(() => {
      syncingFromRoute = false;
    });
  }

  function nextQuery() {
    const query: LocationQueryRaw = { ...route.query };
    const search = options.search.value.trim();

    if (search) query[searchKey] = search;
    else delete query[searchKey];

    for (const filter of options.filters) {
      const defaultValue = filter.defaultValue || "all";
      if (filter.value.value !== defaultValue) query[filter.key] = filter.value.value;
      else delete query[filter.key];
    }

    if (options.page.value > 1) query[pageKey] = String(options.page.value);
    else delete query[pageKey];

    return query;
  }

  applyRouteQuery();

  watch(() => route.query, (query) => {
    applyRouteQuery(query);
  });

  watch([options.search, ...options.filters.map((filter) => filter.value)], () => {
    if (!syncingFromRoute) options.page.value = 1;
  });

  watch([options.search, options.page, ...options.filters.map((filter) => filter.value)], () => {
    if (syncingFromRoute) return;
    const query = nextQuery();
    if (sameQuery(route.query, query)) return;
    void router.replace({ query });
  }, { flush: "post" });
}
