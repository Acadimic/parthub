import { Card } from '@components/app';
import { PresignedImage } from '@components/app/attachments/PresignedImage';
import { StandardWithLogo } from '@components/common';
import { ICourse, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import Link from 'next/link';
import { CourseInfo } from './';

export const CourseCard = observer(({ course }: { course: ICourse }) => {
  // const { push } = useRouter();
  const { userStore, selectorStore, standardStore } = useStores();
  const { getOrgById } = userStore;
  const { setSelectedCourseId } = selectorStore;
  const { getStandardsByIds } = standardStore;
  const org = getOrgById(course.org);

  const onClickCourse = () => {
    setSelectedCourseId(course._id);
    // const pathname = ``;
    // const params = { pathname, query: { courseId: course._id } };
    // push(params, pathname);
  };

  return (
    <Link href={`/courses/${course._id}/preview`} onClick={onClickCourse}>
      <Card className="rounded border-2">
        <div className="flex flex-col space-y-2 w-full">
          <div className="h-60 w-full">
            <PresignedImage className="rounded-t object-cover" url={course.attachments[0].url} noOpen />
          </div>
          <div className="p-3 flex flex-col space-y-3">
            {/* <div className="text-xs text-color-secondary font-medium flex items-center space-x-2">
              <div className="p-0.5 border border-color-border rounded-md">
                <div className="h-8 w-8">
                  {org?.logo ? (
                    <PresignedImage className="rounded-2xl" url={org.logo} />
                  ) : (
                    <BuildingApartment weight="light" className="w-full h-full text-color-secondary" />
                  )}
                </div>
              </div>
              <div>{org?.name}</div>
            </div> */}
            <StandardWithLogo standard={getStandardsByIds(course.standards)[0]} />
            <div>
              <div className="font-medium truncate">{course.name}</div>
              <div className="text-sm text-color-secondary truncate">{course.description}</div>
            </div>
            <div className="text-xs text-color-secondary">
              <CourseInfo courseStats={course.stats} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

// import { Button } from '@components/app';
// import { DotsNine } from '@phosphor-icons/react';
// import { ICourse } from '@stores';
// import { useRouter } from 'next/router';

// const InfoItem = ({ name, value }: { name: string; value: any }) => {
//   return (
//     <div className="flex text-gradient flex-col text-center">
//       <div className="text-sm font-bold">{value}</div>
//       <div className="text-xs font-semibold">{name}</div>
//     </div>
//   );
// };

// export const CourseCard = ({ course }: { course: ICourse }) => {
//   const { push } = useRouter();

//   const onClickAttempt = () => {
//     const pathname = '/attempt';
//     const params = { pathname, query: { id: course._id } };
//     push(params, pathname);
//   };

//   const onClickPractice = () => {
//     const pathname = '/practice';
//     const params = { pathname, query: { id: course._id, isPractice: true } };
//     push(params, pathname);
//   };

//   return (
//     <>
//       <div className="box-shadow border border-color-border rounded-sm flex flex-col space-y-6 p-4 bg-background-secondary">
//         <div className="flex justify-start items-center space-x-3">
//           <DotsNine className="w-4 h-4 text-blue-primary" />
//           <div className="text-sm font-semibold truncate">{course.name}</div>
//         </div>
//         <div className="flex justify-center space-x-8 items-center">
//           <InfoItem name="Days" value={course.daysCount} />
//           <InfoItem name="Materials" value={course.materialsCount} />
//           <InfoItem name="Tests" value={course.testPapersCount} />
//         </div>
//         <div className="flex justify-around">
//           <Button text="Practice" onClick={onClickPractice} />
//           <Button text="Attempt" onClick={onClickAttempt} />
//         </div>
//       </div>
//     </>
//   );
// };
