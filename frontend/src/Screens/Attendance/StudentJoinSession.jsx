import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
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
			// Initialize QR scanner when no token yet
			if (token) return;
			const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
			scanner.render(
				(decodedText) => {
					const text = String(decodedText).trim();
					if (text) {
						setToken(text);
						scanner.clear().catch(() => {});
					}
				},
				() => {}
			);
			return () => {
				try { scanner.clear(); } catch (e) {}
			};
		}, [token]);

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
			<h2 className="text-2xl font-semibold mb-4">Join Attendance Session</h2>
							{!token && (
								<div className="bg-gray-100 p-4 rounded">
									<p className="mb-2">Scan the QR code provided by your teacher:</p>
									<div id="qr-reader" className="w-full" />
								</div>
							)}

			{token && !selfieData && (
				<div className="mt-6">
					<p className="mb-2">Get ready for a selfie. Capturing in:</p>
					<Countdown seconds={countdown} />
					<Webcam ref={webcamRef} audio={false} screenshotFormat="image/png" className="rounded border w-full" />
				</div>
			)}

			{selfieData && !marked && (
				<div className="mt-6">
					<p className="mb-2">Preview your selfie</p>
					<img src={selfieData} alt="Selfie" className="rounded border max-w-xs" />
					<div className="mt-4 flex gap-3">
						<CustomButton onClick={markAttendance}>Submit Attendance</CustomButton>
						<CustomButton variant="secondary" onClick={() => setSelfieData(null)}>Retake</CustomButton>
					</div>
				</div>
			)}

			{marked && (
				<div className="mt-6 p-4 border rounded bg-green-50">
					<h3 className="font-semibold mb-2">Present ✔</h3>
					{marked.selfieUrl && <img src={marked.selfieUrl} alt="Selfie" className="rounded border max-w-xs mb-2" />}
					<p>Marked at: {new Date(marked.markedAt).toLocaleString()}</p>
				</div>
			)}
		</div>
	);
};

export default StudentJoinSession;

