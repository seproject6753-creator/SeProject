import React, { useEffect, useState } from "react";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";
import toast from "react-hot-toast";

const TeacherSessionView = ({ sessionId }) => {
	const [data, setData] = useState({ totalMarked: 0, active: false, expiresAt: null });

		const exportExcel = async () => {
			try {
				const token = sessionStorage.getItem("userToken");
				const resp = await axiosWrapper.get(`/attendance/session/${sessionId}/export`, {
					headers: { Authorization: `Bearer ${token}` },
					responseType: "blob",
				});
				const url = window.URL.createObjectURL(new Blob([resp.data]));
				const link = document.createElement("a");
				link.href = url;
				link.setAttribute("download", `attendance_${sessionId}.xlsx`);
				document.body.appendChild(link);
				link.click();
				link.remove();
			} catch (e) {
				toast.error("Failed to download excel");
			}
		};

	return (
		<div className="mt-4">
			<CustomButton onClick={exportExcel}>Download Excel</CustomButton>
		</div>
	);
};

export default TeacherSessionView;

