"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Lock, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatDialogProps {
	taskId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChatDialog({ taskId, open, onOpenChange }: ChatDialogProps) {
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const task = useQuery(api.src.tasks.queries.getTaskById, open ? { id: taskId as any } : "skip");

	const messages = useQuery(api.src.chatMessages.queries.getMessagesByTaskId, open ? { taskId: taskId as any } : "skip");

	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const currentUser = userData?.user;
	const isStaff = currentUser?.isStaff ?? false;

	const sendMessage = useMutation(api.src.chatMessages.mutations.sendMessage);

	const isComplete = task?.status === "Complete";

	// Scroll to bottom when new messages arrive.
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const handleSend = async () => {
		if (!message.trim() || !task || !currentUser || isSending || isComplete) {
			return;
		}

		const senderName = currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : (currentUser.email ?? "Unknown User");

		const senderType = isStaff ? "employee" : "contact";

		setIsSending(true);
		try {
			await sendMessage({
				taskId: taskId as any,
				content: message.trim(),
				senderName,
				senderType,
			});
			setMessage("");
		} catch (error) {
			console.error("Error sending message:", error);
			alert("Failed to send message. Please try again.");
		} finally {
			setIsSending(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
				<DialogHeader className="pr-8">
					<div className="flex items-center gap-3">
						<DialogTitle>{task?.name || "Chat"}</DialogTitle>
						{task?.status && <Badge variant={isComplete ? "secondary" : "outline"}>{task.status}</Badge>}
					</div>
					{task?.description && <DialogDescription>{task.description}</DialogDescription>}
				</DialogHeader>

				<div className="flex flex-col flex-1 min-h-0">
					{/* Messages Area */}
					<ScrollArea className="flex-1 border rounded-lg p-4 mb-4 h-[400px]" ref={scrollAreaRef}>
						<div className="space-y-5">
							{messages === undefined ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : messages.length === 0 ? (
								<div className="flex items-center justify-center py-8 text-muted-foreground">No messages yet. Start the conversation!</div>
							) : (
								messages.map((msg) => {
									const isOwnMessage = msg.senderId === currentUser?._id;

									return (
										<div key={msg._id} className={`flex flex-col gap-1.5 ${isOwnMessage ? "items-end" : "items-start"}`}>
											{/* Sender name */}
											<span className="text-xs font-medium px-1 text-muted-foreground">{msg.senderName}</span>

											{/* Message bubble */}
											<div
												className={`max-w-[80%] rounded-xl px-4 py-3 ${
													isOwnMessage
														? "bg-primary text-primary-foreground"
														: "bg-zinc-200 dark:bg-zinc-700"
												}`}
											>
												<p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">{msg.content}</p>
											</div>

											{/* Timestamp */}
											<span className="text-[11px] text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
										</div>
									);
								})
							)}
							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>

					{/* Input Area */}
					{isComplete ? (
						<div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/50 border text-muted-foreground">
							<Lock className="h-4 w-4" />
							<span className="text-sm">This conversation is complete.</span>
						</div>
					) : (
						<div className="flex gap-2">
							<Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Type your message..."
								className="min-h-[80px] resize-none"
								disabled={isSending}
							/>
							<Button onClick={handleSend} disabled={!message.trim() || isSending} size="icon" className="h-[80px] w-[80px]">
								{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
