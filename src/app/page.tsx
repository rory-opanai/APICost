import Calculator from "@/components/home/Calculator";
import HowTo from "@/components/home/HowTo";
import WhatThisIs from "@/components/home/WhatThisIs";
import { DEFAULT_STATE } from "@/lib/state/queryState";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <WhatThisIs />
      <Calculator initialState={DEFAULT_STATE} />
      <section id="how-to-use" className="scroll-mt-24">
        <HowTo />
      </section>
    </div>
  );
}
