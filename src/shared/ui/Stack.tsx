import {
	motion,
	type PanInfo,
	useMotionValue,
	useTransform,
} from "motion/react";
import { type ReactNode, useCallback, useEffect, useState } from "react";

interface CardRotateProps {
	children: ReactNode;
	onSendToBack: () => void;
	sensitivity: number;
	disableDrag?: boolean;
}

function CardRotate({
	children,
	onSendToBack,
	sensitivity,
	disableDrag = false,
}: CardRotateProps) {
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const rotateX = useTransform(y, [-100, 100], [60, -60]);
	const rotateY = useTransform(x, [-100, 100], [-60, 60]);

	function handleDragEnd(
		_event: MouseEvent | TouchEvent | PointerEvent,
		info: PanInfo,
	) {
		if (
			Math.abs(info.offset.x) > sensitivity ||
			Math.abs(info.offset.y) > sensitivity
		) {
			onSendToBack();
		} else {
			x.set(0);
			y.set(0);
		}
	}

	if (disableDrag) {
		return (
			<motion.div
				className="absolute inset-0 cursor-pointer"
				style={{ x: 0, y: 0 }}
			>
				{children}
			</motion.div>
		);
	}

	return (
		<motion.div
			className="absolute inset-0 cursor-grab"
			style={{ x, y, rotateX, rotateY }}
			drag
			dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
			dragElastic={0.6}
			whileTap={{ cursor: "grabbing" }}
			onDragEnd={handleDragEnd}
		>
			{children}
		</motion.div>
	);
}

interface StackProps {
	randomRotation?: boolean;
	sensitivity?: number;
	sendToBackOnClick?: boolean;
	cards?: ReactNode[];
	animationConfig?: { stiffness: number; damping: number };
	autoplay?: boolean;
	autoplayDelay?: number;
	pauseOnHover?: boolean;
	mobileClickOnly?: boolean;
	mobileBreakpoint?: number;
	// Added on top of the upstream react-bits component: it ships no way to
	// know which card is on top or which one got clicked. `index` is the
	// position of that card within the `cards` array this component was
	// given (stable across re-ordering), so the caller can map it back to
	// its own data.
	onFrontCardClick?: (index: number) => void;
	// Which card (by that same index) should render lifted — only applied
	// while it's also the front card, so a card that's been dragged away
	// never visually pokes up out of the stack.
	armedIndex?: number | null;
	// Fires when the front card is sent to back by a real drag (never by a
	// click) — lets the caller clear its own armed state before this index
	// is reused for a now-buried card.
	onFrontCardDragAway?: (index: number) => void;
}

export default function Stack({
	randomRotation = false,
	sensitivity = 200,
	cards = [],
	animationConfig = { stiffness: 260, damping: 20 },
	sendToBackOnClick = false,
	autoplay = false,
	autoplayDelay = 3000,
	pauseOnHover = false,
	mobileClickOnly = false,
	mobileBreakpoint = 768,
	onFrontCardClick,
	armedIndex = null,
	onFrontCardDragAway,
}: StackProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < mobileBreakpoint);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, [mobileBreakpoint]);

	const shouldDisableDrag = mobileClickOnly && isMobile;
	const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

	const [stack, setStack] = useState<{ id: number; content: ReactNode }[]>(() =>
		cards.map((content, index) => ({ id: index + 1, content })),
	);

	useEffect(() => {
		setStack(cards.map((content, index) => ({ id: index + 1, content })));
	}, [cards]);

	const sendToBack = useCallback((id: number) => {
		setStack((prev) => {
			const newStack = [...prev];
			const index = newStack.findIndex((card) => card.id === id);
			const [card] = newStack.splice(index, 1);
			newStack.unshift(card);
			return newStack;
		});
	}, []);

	useEffect(() => {
		if (autoplay && stack.length > 1 && !isPaused) {
			const interval = setInterval(() => {
				const topCardId = stack[stack.length - 1].id;
				sendToBack(topCardId);
			}, autoplayDelay);

			return () => clearInterval(interval);
		}
	}, [autoplay, autoplayDelay, stack, isPaused, sendToBack]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover only pauses
		// the optional autoplay cycle (unused here); dragging/clicking a card
		// stays fully keyboard/touch reachable via the cards themselves.
		<div
			className="relative h-full w-full"
			style={{ perspective: 600 }}
			onMouseEnter={() => pauseOnHover && setIsPaused(true)}
			onMouseLeave={() => pauseOnHover && setIsPaused(false)}
		>
			{stack.map((card, index) => {
				const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
				const isFront = index === stack.length - 1;
				const isArmed = isFront && armedIndex === card.id - 1;
				return (
					<CardRotate
						key={card.id}
						onSendToBack={() => {
							sendToBack(card.id);
							if (isFront) onFrontCardDragAway?.(card.id - 1);
						}}
						sensitivity={sensitivity}
						disableDrag={shouldDisableDrag}
					>
						<motion.div
							className="h-full w-full overflow-hidden rounded-2xl"
							onClick={() => {
								if (isFront) onFrontCardClick?.(card.id - 1);
								if (shouldEnableClick) sendToBack(card.id);
							}}
							animate={{
								rotateZ: (stack.length - index - 1) * 4 + randomRotate,
								scale: isArmed ? 1.2 : 1 + index * 0.06 - stack.length * 0.06,
								y: isArmed ? -50 : 0,
								transformOrigin: "90% 90%",
							}}
							initial={false}
							transition={{
								type: "spring",
								stiffness: animationConfig.stiffness,
								damping: animationConfig.damping,
							}}
						>
							{card.content}
						</motion.div>
					</CardRotate>
				);
			})}
		</div>
	);
}
