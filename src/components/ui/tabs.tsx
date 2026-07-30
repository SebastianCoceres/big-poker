"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = {
	title: string;
	value: string;
	content?: React.ReactNode;
};

export const Tabs = ({
	tabs,
	containerClassName,
	activeTabClassName,
	tabClassName,
	contentClassName,
}: {
	tabs: Tab[];
	containerClassName?: string;
	activeTabClassName?: string;
	tabClassName?: string;
	contentClassName?: string;
}) => {
	const [activeValue, setActiveValue] = useState(tabs[0]?.value);

	return (
		<>
			<div
				className={cn(
					"flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
					containerClassName,
				)}
			>
				{tabs.map((tab) => (
					<button
						key={tab.value}
						type="button"
						onClick={() => setActiveValue(tab.value)}
						className={cn("relative px-4 py-2 rounded-full", tabClassName)}
						style={{
							transformStyle: "preserve-3d",
						}}
					>
						{activeValue === tab.value && (
							<motion.div
								layoutId="clickedbutton"
								transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
								className={cn(
									"absolute inset-0 bg-gray-200 dark:bg-zinc-800 rounded-full ",
									activeTabClassName,
								)}
							/>
						)}

						<span className="relative block text-black dark:text-white">
							{tab.title}
						</span>
					</button>
				))}
			</div>
			<FadeInDiv
				tabs={tabs}
				activeValue={activeValue}
				className={cn("mt-32", contentClassName)}
			/>
		</>
	);
};

export const FadeInDiv = ({
	className,
	tabs,
	activeValue,
}: {
	className?: string;
	tabs: Tab[];
	activeValue?: string;
}) => {
	return (
		<div className="relative min-h-0 w-full flex-1">
			{tabs.map((tab) => (
				<motion.div
					key={tab.value}
					style={{
						zIndex: tab.value === activeValue ? 0 : -1,
						opacity: tab.value === activeValue ? 1 : 0,
						pointerEvents: tab.value === activeValue ? "auto" : "none",
					}}
					className={cn("h-full w-full absolute top-0 left-0", className)}
				>
					{tab.content}
				</motion.div>
			))}
		</div>
	);
};
