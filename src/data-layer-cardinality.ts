export const cardinalityComparisons = [">", ">=", "==", "<", "<="] as const;

export type CardinalityComparison = typeof cardinalityComparisons[number];
export type CardinalityPropertyType = "string" | "array";

export interface CardinalityBounds {
  minimum?: number;
  maximum?: number;
  impossible?: true;
}

export function cardinalityMeasuredValue(propertyType: CardinalityPropertyType): string {
  return propertyType === "string" ? "string character count" : "array item count";
}

export function cardinalityComparisonPasses(
  actual: number,
  comparison: CardinalityComparison,
  limit: number,
): boolean {
  if (comparison === ">") return actual > limit;
  if (comparison === ">=") return actual >= limit;
  if (comparison === "==") return actual === limit;
  if (comparison === "<") return actual < limit;
  return actual <= limit;
}

export function cardinalityBounds(
  comparison: CardinalityComparison,
  limit: number,
): CardinalityBounds {
  if (comparison === ">") return { minimum:limit + 1 };
  if (comparison === ">=") return { minimum:limit };
  if (comparison === "==") return { minimum:limit, maximum:limit };
  if (comparison === "<") return limit <= 0 ? { impossible:true } : { maximum:limit - 1 };
  return { maximum:limit };
}

export function cardinalityConstraint(
  kind: "text length" | "item count",
  comparison: CardinalityComparison,
  limit: number,
): string {
  const relation = comparison === ">" ? "greater than"
    : comparison === ">=" ? "at least"
      : comparison === "==" ? "exactly"
        : comparison === "<" ? "less than"
          : "at most";
  return `${kind} ${relation} ${limit}`;
}
