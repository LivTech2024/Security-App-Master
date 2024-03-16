import notFoundSvg from "../../public/assets/not_found.svg";

interface NotFoundProps {
  title?: string;
}

const NotFound = ({ title = "no_item" }: NotFoundProps) => {
  return (
    <div className="flex flex-col w-full  gap-4 items-center justify-center h-full p-8 min-h-[50vh]">
      <div className="flex justify-center items-center">
        <img
          src={notFoundSvg}
          alt="No Search Result"
          style={{ width: "150px", height: "150px" }}
        />
      </div>
      <div className="font-semibold font-sfProTextSemibold text-lg text-textTertiaryLight">
        {title}
      </div>
    </div>
  );
};

export default NotFound;
