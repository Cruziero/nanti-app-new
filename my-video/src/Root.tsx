import "./index.css";
import { Composition } from "remotion";
import { INTRO_DURATION, Intro } from "./nanti/Intro";
import { PROMO_DURATION, Promo } from "./nanti/Promo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NantiIntro"
        component={Intro}
        durationInFrames={INTRO_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NantiPromo"
        component={Promo}
        durationInFrames={PROMO_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
