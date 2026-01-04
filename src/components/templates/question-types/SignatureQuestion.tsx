"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SignatureQuestionProps {
	questionId: string;
	value: string | null; // Base64 image data
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function SignatureQuestion({ questionId, value, onChange, required, disabled }: SignatureQuestionProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (disabled) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.beginPath();
		ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
		setIsDrawing(true);
	};

	const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing || disabled) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
		ctx.stroke();
	};

	const stopDrawing = () => {
		if (!isDrawing) return;
		setIsDrawing(false);

		if (disabled) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dataUrl = canvas.toDataURL();
		onChange(questionId, dataUrl);
	};

	const clearSignature = () => {
		if (disabled) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		onChange(questionId, null);
	};

	// Initialize canvas.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.strokeStyle = "#000";
		ctx.lineWidth = 2;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		// Load existing signature if value exists.
		if (value) {
			const img = new Image();
			img.onload = () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
			};
			img.src = value;
		}
	}, [value]);

	return (
		<div className="space-y-2">
			<canvas
				ref={canvasRef}
				width={600}
				height={200}
				className={`border rounded ${disabled ? "cursor-not-allowed opacity-50" : "cursor-crosshair"}`}
				onMouseDown={startDrawing}
				onMouseMove={draw}
				onMouseUp={stopDrawing}
				onMouseLeave={stopDrawing}
			/>
			<div className="flex justify-end">
				<Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={disabled}>
					<Trash2 className="h-4 w-4 mr-2" />
					Clear
				</Button>
			</div>
		</div>
	);
}

