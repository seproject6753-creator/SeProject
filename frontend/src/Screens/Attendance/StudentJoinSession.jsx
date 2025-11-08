import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";

const Countdown = ({ seconds }) => (
	<div className="text-4xl font-bold text-center my-4">{seconds}</div>
);

const StudentJoinSession = () => {
	const [token, setToken] = useState("");
	const [countdown, setCountdown] = useState(0);
	const [selfieData, setSelfieData] = useState(null);
	const webcamRef = useRef(null);
	const [marked, setMarked] = useState(null);

		useEffect(() => {
			if (token && countdown === 0 && !selfieData) {
				setCountdown(5);
			}
		}, [token]);

		useEffect(() => {
			// Initialize / re-initialize QR scanner when we don't have a token yet
			if (token) return;
			const scannerConfig = {
				fps: 10,
				qrbox: { width: 250, height: 250 },
				rememberLastUsedCamera: true,
				aspectRatio: 1.0,
				formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
				showTorchButtonIfSupported: true,
				showZoomSliderIfSupported: true,
				experimentalFeatures: { useBarCodeDetectorIfSupported: true },
				// Improves reliability for static image scans (screenshots / downloads)
				useExactSupportedFormats: true,
			};
			const scanner = new Html5QrcodeScanner("qr-reader", scannerConfig);
			scanner.render(
				(decodedText) => {
					const text = String(decodedText).trim();
					if (text) {
						setToken(text);
						// We clear the scanner to free camera; user can press Reset to scan a different code
						scanner.clear().catch(() => {});
					}
				},
				(errorMessage) => {
					// Suppress noisy 'NotFoundException' to avoid spamming toast; show only specific guidance occasionally
					if (errorMessage?.includes("NotFoundException")) return;
				}
			);
			return () => {
				try { scanner.clear(); } catch (e) {}
			};
		}, [token]);

	const resetScan = () => {
		setToken("");
		setCountdown(0);
		setSelfieData(null);
		setMarked(null);
		// Scanner will re-init via effect on next render
	};

	useEffect(() => {
		if (countdown <= 0 || !token) return;
		const id = setTimeout(() => setCountdown(countdown - 1), 1000);
		if (countdown === 1) {
			captureSelfie();
		}
		return () => clearTimeout(id);
	}, [countdown, token]);

	const captureSelfie = () => {
		if (!webcamRef.current) return;
		const imageSrc = webcamRef.current.getScreenshot();
		setSelfieData(imageSrc);
	};

	const markAttendance = async () => {
		if (!token || !selfieData) return toast.error("Scan a QR and take selfie");
		try {
			const blob = await (await fetch(selfieData)).blob();
			const form = new FormData();
			form.append("selfie", blob, `selfie_${Date.now()}.png`);
			const resp = await axiosWrapper.post(`/attendance/mark?token=${token}`, form, {
				headers: {
					Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
					"Content-Type": "multipart/form-data",
				},
			});
			setMarked(resp.data.data);
			toast.success("Attendance marked");
		} catch (e) {
			toast.error(e.response?.data?.message || "Failed to mark attendance");
		}
	};

	return (
		<div className="max-w-3xl mx-auto">
			<h2 className="text-3xl font-bold mb-6">Join Attendance Session</h2>
			{!token && (
				<div className="p-5 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur shadow-glow-lg">
					<p className="mb-3 text-slate-300 text-sm">Scan the QR code provided by your teacher:</p>
					<div
						id="qr-reader"
						className="w-full rounded-lg border border-white/10 bg-slate-800/40 min-h-[260px] flex items-center justify-center overflow-hidden"
					/>
						<div className="mt-4 text-xs text-slate-500 space-y-1">
							<p>If camera doesn’t appear, allow permissions in browser settings.</p>
							<p className="italic">Trouble scanning image files? Ensure: full QR visible, good contrast, not too blurry, no heavy compression.</p>
						</div>
				</div>
			)}

			{token && !selfieData && (
				<div className="mt-8 p-5 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur">
					<p className="mb-2 text-slate-300 text-sm">Get ready for a selfie. Capturing in:</p>
					<Countdown seconds={countdown} />
					<Webcam
						ref={webcamRef}
						audio={false}
						screenshotFormat="image/png"
						className="rounded-lg border border-white/10 w-full shadow-inner"
					/>
				</div>
			)}

			{selfieData && !marked && (
				<div className="mt-8 p-5 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur">
					<p className="mb-3 text-slate-300 text-sm">Preview your selfie</p>
					<img
						src={selfieData}
						alt="Selfie"
						className="rounded-lg border border-white/10 max-w-xs shadow-glow-md"
					/>
					<div className="mt-5 flex flex-wrap gap-4">
						<CustomButton onClick={markAttendance} className="flex-1 md:flex-none">Submit Attendance</CustomButton>
						<CustomButton
							variant="secondary"
							onClick={() => setSelfieData(null)}
							className="flex-1 md:flex-none bg-slate-700/60 hover:bg-slate-700"
						>
							Retake
						</CustomButton>
							<CustomButton
								variant="secondary"
								onClick={resetScan}
								className="flex-1 md:flex-none bg-slate-700/60 hover:bg-slate-700"
							>
								Reset / Rescan QR
							</CustomButton>
					</div>
				</div>
			)}

			{marked && (
				<div className="mt-8 p-5 rounded-xl border border-green-500/30 bg-green-900/20 backdrop-blur">
					<h3 className="font-semibold mb-3 text-green-300 flex items-center gap-2">
						<span>Present ✔</span>
					</h3>
					{marked.selfieUrl && (
						<img
							src={marked.selfieUrl}
							alt="Selfie"
							className="rounded-lg border border-white/10 max-w-xs mb-4 shadow-glow-md"
						/>
					)}
					<p className="text-sm text-slate-300">Marked at: {new Date(marked.markedAt).toLocaleString()}</p>
						<div className="mt-4">
							<CustomButton variant="secondary" onClick={resetScan} className="bg-slate-700/60 hover:bg-slate-700">
								Mark Another / Rescan
							</CustomButton>
						</div>
				</div>
			)}
	</div>
	);
};

export default StudentJoinSession;

