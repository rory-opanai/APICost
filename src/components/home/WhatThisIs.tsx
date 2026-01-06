import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function WhatThisIs() {
  return (
    <Card>
      <CardHeader title="What this tool is" description="A lightweight estimator for OpenAI API costs." />
      <CardBody className="space-y-3 text-sm text-ink-700">
        <p>
          <span className="font-medium text-ink-900">OpenAI API Deal Sizer</span> estimates monthly and annual costs
          from message volumes, token totals, or video seconds. Use low/base/high scenarios to communicate uncertainty
          and compare multiple models side-by-side.
        </p>
      </CardBody>
    </Card>
  );
}
