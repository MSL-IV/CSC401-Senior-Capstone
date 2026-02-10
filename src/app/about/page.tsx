import dynamic from "next/dynamic";

const About = dynamic(() => import("@/components/about"), {
  ssr: false,
});

export default function Page() {
    return <About />;
}