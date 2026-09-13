type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be rendered as raw JSON text
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
