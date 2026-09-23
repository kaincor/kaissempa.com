import About from "@/components/About";
import Hero from "@/components/Hero";
import MoreAboutMe from "@/components/MoreAboutMe";
import SocialLinks from "@/components/SocialLinks";
import ProjectsAndProducts from "@/components/ProjectsAndProducts";
import MountainRange from "@/components/MountainRange";
import RidgeDivider from "@/components/RidgeDivider";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

/**
 * Two depth planes around the transparent Spline scene.
 *
 * `drop` is negative on both, which lifts each baseline ABOVE the fold. That
 * matters: every range tapers to roughly zero height at x=0 and x=640, so with
 * the baseline sitting below the fold the bottom corners of the screen carry no
 * black at all and the ridge looks like it stops short of the edges. Lifting it
 * puts the solid fill under the whole width.
 *
 * Both planes are pure black, so the back ridge only shows where it clears the
 * front one's outline. It gets the taller clamp of the two despite being the
 * more distant layer — sink it and it vanishes behind the foreground.
 *
 * Depth reads from the gap between the rates, not their size: 45 against 180.
 */
const BACK = rangeById(13);
const FRONT = rangeById(12);
/** Flipped, so its peaks hang down out of the black section. */
const CLOSING = rangeById(13);
/** Opens the More About Me section, peaks upward into the grey. */
const OPENING = rangeById(1);
/** Flipped, closing More About Me back out into the page grey. */
const FOOTER_RIDGE = rangeById(4);

/**
 * How far the intro's mountain range lifts, and therefore how much every block
 * below it owes.
 *
 * MountainRange lifts its own block without reserving layout for it, so the
 * next block has to move up by the same amount to keep the seam closed. That
 * used to stop at the first divider, which left its whole 180px sitting as
 * grey between "More about me" and the ridge underneath it — a fixed gap in a
 * layout where the ridges and the type are fluid, so it read as merely roomy on
 * a wide screen and as a chasm on a tablet, where the ridge is half the height
 * and the heading two thirds the size.
 *
 * The debt is now passed along the whole chain and discharged once, with
 * trimBottom on the last block, so it never lands in the middle of the page.
 */
const INTRO_LIFT_TOTAL = 180;

/**
 * Travel of the ridge that closes the intro.
 *
 * Halved from 70. Most of the black the reader actually saw under that copy was
 * this value still in flight: settled the gap was 35px, but the copy is only on
 * screen while the ridge is partway through its rise, so what showed was closer
 * to 85. Shortening the throw cuts what is visible rather than what is left at
 * the end, which is the part that was too big.
 */
const INTRO_LIFT = 36;

/**
 * Travel of the footer ridge. Kept short because trimBottom shortens the
 * document by the inherited lift, which puts the "end end" scroll position a
 * little out of reach — whatever travel has not run by the true bottom of the
 * page simply never runs. A small throw keeps that remainder small.
 */
const FOOTER_RISE = 45;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero
        behind={
          <RidgeLayer
            range={BACK}
            height="clamp(105px, 16vw, 240px)"
            rise={45}
            drop={-10}
          />
        }
      />

      <MountainRange
        range={FRONT}
        height="clamp(75px, 11vw, 190px)"
        rise={180}
        drop={-24}
        // The divider below extends black upward behind itself, so the default
        // reserve here would only add dead space above the ridge.
        padBottom={0}
      >
        <About />
      </MountainRange>

      {/* padBottom 0 above plus followLift here sits this block flush against
          the bottom of the black section, at every scroll position rather than
          only once the lift above has finished. It used to be a constant
          pullUp, which held on a tall window and failed on a phone: the About
          section collapses to about a third of its desktop height there, so
          this block reaches the screen after ~150px of scrolling, when the
          section above has lifted 30 of its 180.

          It must meet that edge and never cross it: pulled over the black
          section, the ridge's notches show black from behind instead of the
          page grey, and the silhouette vanishes into a straight line.

          rise is 70, not the 180 above. Both blocks parallax, so the gap is the
          difference of two transforms; at 180 it swung by that much. */}
      <RidgeDivider range={CLOSING} rise={INTRO_LIFT} followLift={INTRO_LIFT_TOTAL}>
        <ProjectsAndProducts />
      </RidgeDivider>

      {/* Heading and ridge are inside this now rather than above it. The
          section pins, and anything left in flow above the pin has scrolled
          away by the time the pin starts — which is why the screen went pure
          black for the whole animation. It also carries the inherited lift
          itself, so the chain down to the footer is unchanged. */}
      <MoreAboutMe range={OPENING} />

      {/* The chips inside carry a drift of their own, on a shorter throw than
          this block's, so the ridge and the row arrive at different rates
          rather than sliding in as one piece. */}
      <RidgeDivider
        range={FOOTER_RIDGE}
        rise={FOOTER_RISE}
        sectionColor="#d4d4d4"
        scrollOffset={["start end", "end end"]}
      >
        <SocialLinks />
      </RidgeDivider>
    </main>
  );
}
