import { useParams, Navigate } from "react-router-dom";
import TechnicianActiveJob from "./ActiveJob";

const TechnicianJobWork = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/technician/jobs" replace />;
  }

  return <TechnicianActiveJob />;
};

export default TechnicianJobWork;
