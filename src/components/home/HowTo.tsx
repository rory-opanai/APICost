import Image from "next/image";

import { Accordion } from "@/components/ui/Accordion";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const faqs = [
  {
    title: "What counts as output tokens?",
    content: (
      <p>
        Output tokens include everything the model generates, including <strong>reasoning tokens</strong>. Treat
        “reasoning” as billable output.
      </p>
    )
  },
  {
    title: "When should I use message mode vs token mode?",
    content: (
      <p>
        Use <strong>message mode</strong> when you only know message volume and rough token averages. Use{" "}
        <strong>token mode</strong> when you have telemetry or a prior workload benchmark.
      </p>
    )
  },
  {
    title: "What does cached input mean?",
    content: (
      <p>
        Some models have a discounted rate for cached prompt tokens. Only enter a cached % if the selected model shows
        cached pricing, and only if you expect meaningful cache hit rates.
      </p>
    )
  }
];

export default function HowTo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="How it works" description="Three steps from rough inputs to a clear estimate." />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
            <Image
              src="/howto/step-choose-model.svg"
              alt="Choose a category and model illustration"
              width={640}
              height={200}
              className="h-20 w-full object-contain"
            />
            <h3 className="mt-3 text-sm font-semibold text-ink-900">Step 1: Choose category + model(s)</h3>
            <p className="mt-1 text-sm text-ink-700">Pick Text, Image tokens, Audio tokens, Video, or Image (per-image).</p>
          </div>
          <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
            <Image
              src="/howto/step-enter-volume.svg"
              alt="Enter volume and assumptions illustration"
              width={640}
              height={200}
              className="h-20 w-full object-contain"
            />
            <h3 className="mt-3 text-sm font-semibold text-ink-900">Step 2: Enter volume</h3>
            <p className="mt-1 text-sm text-ink-700">
              Use presets for message mode, or drop in known token counts/seconds/images.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
            <Image
              src="/howto/step-review-scenarios.svg"
              alt="Review scenario bands and results illustration"
              width={640}
              height={200}
              className="h-20 w-full object-contain"
            />
            <h3 className="mt-3 text-sm font-semibold text-ink-900">Step 3: Review ranges</h3>
            <p className="mt-1 text-sm text-ink-700">
              Tune low/base/high multipliers, compare models, then copy a summary.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="FAQs" />
        <CardBody>
          <Accordion items={faqs} />
        </CardBody>
      </Card>
    </div>
  );
}
