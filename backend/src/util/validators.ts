export function validateSizeQuery<Size extends number | string>(query: string, sizes: Size[], defaultSize?: Size): Size | undefined {
  if (!query)
    return defaultSize || sizes[Math.floor(sizes.length / 2)];

  if (sizes.includes(query as Size))
    return query as Size;

  const size = Number(query);
  if (isNaN(size))
    return undefined;
  if (!sizes.includes(size as Size))
    return undefined;
  return size as Size;
}
